// ./src/database.ts
import { crypto } from "https://deno.land/std@0.192.0/crypto/mod.ts";
import { logger } from "./logging.ts";

interface Room {
  id: string;
  passwordHash: string;
  users: Set<string>;
  messages: EncryptedMessage[];
}

interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  timestamp: number;
}

class Database {
  private rooms: Map<string, Room> = new Map();

  createRoom(password: string): string {
    const id = crypto.randomUUID();
    const passwordHash = this.hashPassword(password);
    this.rooms.set(id, { id, passwordHash, users: new Set(), messages: [] });
    logger.info(`Room created: ${id}`);
    return id;
  }

  joinRoom(roomId: string, password: string, username: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn(`Room not found: ${roomId}`);
      return false;
    }

    if (this.hashPassword(password) !== room.passwordHash) {
      logger.warn(`Invalid password attempt for room: ${roomId}`);
      return false;
    }

    room.users.add(username);
    logger.info(`User ${username} joined room: ${roomId}`);
    return true;
  }

  async addMessage(roomId: string, username: string, content: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      const key = await this.deriveKey(room.passwordHash);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedContent = await this.encrypt(content, key, iv);
      room.messages.push({ 
        encryptedContent, 
        iv: this.arrayBufferToBase64(iv),
        timestamp: Date.now() 
      });
      logger.info(`Message added to room ${roomId} by ${username}`);
    } else {
      logger.warn(`Room not found when adding message: ${roomId}`);
    }
  }

  async getMessages(roomId: string): Promise<{ username: string; content: string; timestamp: number }[]> {
    const room = this.rooms.get(roomId);
    if (!room) {
      logger.warn(`Room not found when retrieving messages: ${roomId}`);
      return [];
    }

    const key = await this.deriveKey(room.passwordHash);
    return Promise.all(room.messages.map(async (msg) => ({
      username: "Anonymous", // In a real app, you'd decrypt the username too
      content: await this.decrypt(msg.encryptedContent, key, this.base64ToArrayBuffer(msg.iv)),
      timestamp: msg.timestamp
    })));
  }

  async generateToken(username: string, roomId: string, password: string): Promise<string> {
    const timestamp = Date.now();
    const data = `${username}:${roomId}:${timestamp}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(data)
    );
    const token = btoa(`${data}:${this.arrayBufferToBase64(signature)}`);
    logger.info(`Token generated for user ${username} in room ${roomId}`);
    return token;
  }

  async validateToken(token: string, roomId: string): Promise<boolean> {
    try {
      const [username, tokenRoomId, timestamp, signatureBase64] = atob(token).split(':');
      if (tokenRoomId !== roomId) {
        logger.warn(`Token validation failed: room ID mismatch`);
        return false;
      }

      const room = this.rooms.get(roomId);
      if (!room) {
        logger.warn(`Token validation failed: room not found`);
        return false;
      }

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(room.passwordHash),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );
      const data = `${username}:${roomId}:${timestamp}`;
      const signature = this.base64ToArrayBuffer(signatureBase64);
      const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        signature,
        new TextEncoder().encode(data)
      );
      logger.info(`Token validation ${isValid ? 'succeeded' : 'failed'} for user ${username} in room ${roomId}`);
      return isValid;
    } catch (error) {
      logger.error(`Token validation error: ${error.message}`);
      return false;
    }
  }

  private hashPassword(password: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    return await crypto.subtle.importKey(
      "raw",
      data,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
  }

  private async encrypt(data: string, key: CryptoKey, iv: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoder.encode(data)
    );
    return this.arrayBufferToBase64(encryptedData);
  }

  private async decrypt(encryptedData: string, key: CryptoKey, iv: ArrayBuffer): Promise<string> {
    const decoder = new TextDecoder();
    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      this.base64ToArrayBuffer(encryptedData)
    );
    return decoder.decode(decryptedData);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const db = new Database();
