// Simplified Blockchain for Immutable Audit Logs
// Demonstrates blockchain concepts without external dependencies

import crypto from 'crypto'

export interface AuditEntry {
  id: string
  timestamp: number
  userId: string
  action: string
  resourceId: string
  decision: 'ALLOW' | 'DENY' | 'REQUIRE_MFA'
  riskScore: number
  hash: string
}

export interface Block {
  index: number
  timestamp: number
  entries: AuditEntry[]
  previousHash: string
  hash: string
  nonce: number
}

class SimpleBlockchain {
  private chain: Block[] = []
  private currentBlock: AuditEntry[] = []
  private difficulty = 2

  constructor() {
    // Create genesis block
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      entries: [],
      previousHash: '0',
      hash: '',
      nonce: 0,
    }
    genesisBlock.hash = this.calculateHash(genesisBlock)
    this.chain.push(genesisBlock)
  }

  private calculateHash(block: Omit<Block, 'hash'>): string {
    const data = JSON.stringify({
      ...block,
      entries: block.entries.map((e) => ({
        ...e,
        hash: e.hash,
      })),
    })
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  private calculateEntryHash(entry: Omit<AuditEntry, 'hash'>): string {
    const data = JSON.stringify(entry)
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  addEntry(entry: Omit<AuditEntry, 'id' | 'hash'>): AuditEntry {
    const id = `entry-${Date.now()}-${Math.random()}`
    const entryWithHash: AuditEntry = {
      ...entry,
      id,
      hash: this.calculateEntryHash(entry),
    }
    this.currentBlock.push(entryWithHash)

    // Auto-mine when we have 5 entries
    if (this.currentBlock.length >= 5) {
      this.mineBlock()
    }

    return entryWithHash
  }

  mineBlock(): Block {
    const previousBlock = this.chain[this.chain.length - 1]
    let newBlock: Block = {
      index: this.chain.length,
      timestamp: Date.now(),
      entries: [...this.currentBlock],
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
    }

    // Proof of work
    let hash = this.calculateHash(newBlock)
    while (!hash.startsWith('0'.repeat(this.difficulty))) {
      newBlock.nonce++
      hash = this.calculateHash(newBlock)
    }

    newBlock.hash = hash
    this.chain.push(newBlock)
    this.currentBlock = []

    return newBlock
  }

  getChain(): Block[] {
    return this.chain
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i]
      const previousBlock = this.chain[i - 1]

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false
      }

      const calculatedHash = this.calculateHash({
        ...currentBlock,
        hash: '',
      })

      if (!calculatedHash.startsWith('0'.repeat(this.difficulty))) {
        return false
      }
    }
    return true
  }

  getAuditLog(): AuditEntry[] {
    return this.chain.flatMap((block) => block.entries).reverse()
  }

  getBlockCount(): number {
    return this.chain.length
  }

  getCurrentBlockSize(): number {
    return this.currentBlock.length
  }
}

// Global blockchain instance
export const auditBlockchain = new SimpleBlockchain()

export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'hash'>): AuditEntry {
  return auditBlockchain.addEntry(entry)
}

export function getAuditLog(): AuditEntry[] {
  return auditBlockchain.getAuditLog()
}

export function getBlockchainStatus() {
  const chain = auditBlockchain.getChain()
  return {
    isValid: auditBlockchain.isChainValid(),
    blockCount: auditBlockchain.getBlockCount(),
    currentBlockSize: auditBlockchain.getCurrentBlockSize(),
    lastBlockHash: chain[chain.length - 1].hash,
    totalEntries: auditBlockchain.getAuditLog().length,
  }
}

export function mineCurrentBlock(): Block {
  return auditBlockchain.mineBlock()
}

export function getBlockchain(): Block[] {
  return auditBlockchain.getChain()
}
