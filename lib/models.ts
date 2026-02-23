import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, sparse: true },
    email: { type: String, required: true, sparse: true },
    password: { type: String, required: true },
    fullName: String,
    role: { type: String, enum: ['ADMIN', 'USER', 'VIEWER'], default: 'USER' },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    apiKeys: [
      {
        key: String,
        name: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        isActive: { type: Boolean, default: true },
      },
    ],
    // 2FA fields
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],
  },
  { timestamps: true }
)

// Hash password before saving
// Already handled in signup endpoint, no pre-hook needed
// userSchema.pre('save', async function (next: any) { ... })

// Method to compare passwords
userSchema.methods.comparePassword = async function (passwordAttempt: string) {
  return await bcrypt.compare(passwordAttempt, this.password as string)
}

// Access Request Schema
const accessRequestSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    resourceId: { type: String, required: true },
    action: { type: String, required: true },
    timestamp: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DENIED'], default: 'PENDING' },
    context: {
      ipAddress: String,
      deviceId: String,
      location: String,
      userAgent: String,
    },
    riskScore: Number,
    decision: { type: String, enum: ['ALLOW', 'DENY', 'REQUIRE_MFA'] },
  },
  { timestamps: true }
)

// Audit Log Schema (Advanced)
const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Number, required: true },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    resourceId: String,
    decision: { type: String, enum: ['ALLOW', 'DENY', 'REQUIRE_MFA'] },
    riskScore: Number,
    blockHash: String, // For blockchain reference
    // Advanced logging
    ipAddress: String,
    userAgent: String,
    userEmail: String,
    actionDetails: mongoose.Schema.Types.Mixed,
    status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS' },
    errorMessage: String,
    previousValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
)

// ML Risk Classification Schema
const mlResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    resourceId: String,
    mlRiskScore: { type: Number, required: true },
    behavioralScore: Number,
    federatedScore: Number,
    timestamp: { type: Number, required: true },
    features: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
)

// Workflow Execution Schema
const workflowSchema = new mongoose.Schema(
  {
    workflowId: { type: String, required: true },
    accessRequestId: String,
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    steps: [
      {
        stepId: String,
        name: String,
        status: String,
        timestamp: Number,
      },
    ],
    result: mongoose.Schema.Types.Mixed,
    timestamp: { type: Number, required: true },
  },
  { timestamps: true }
)

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema)
const AccessRequest = mongoose.models.AccessRequest || mongoose.model('AccessRequest', accessRequestSchema)
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
const MLResult = mongoose.models.MLResult || mongoose.model('MLResult', mlResultSchema)
const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema)

export { User, AccessRequest, AuditLog, MLResult, Workflow }
