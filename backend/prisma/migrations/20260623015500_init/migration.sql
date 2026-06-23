-- CreateTable
CREATE TABLE `Company` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `legalEntityNumber` VARCHAR(100) NULL,
    `logoDocumentId` CHAR(36) NULL,
    `address` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Company_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Division` (
    `id` CHAR(36) NOT NULL,
    `companyId` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `headUserId` CHAR(36) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Division_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` CHAR(36) NOT NULL,
    `divisionId` CHAR(36) NULL,
    `parentDepartmentId` CHAR(36) NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `headUserId` CHAR(36) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Department_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` CHAR(36) NOT NULL,
    `divisionId` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `address` TEXT NULL,
    `picUserId` CHAR(36) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Branch_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `isSystemDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(150) NOT NULL,
    `resource` VARCHAR(100) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `label` VARCHAR(200) NOT NULL,

    UNIQUE INDEX `Permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `permissionId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NULL,
    `departmentId` CHAR(36) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActiveSession` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenJti` VARCHAR(255) NOT NULL,
    `ipAddress` VARCHAR(45) NOT NULL,
    `userAgent` TEXT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ActiveSession_tokenJti_key`(`tokenJti`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `approvalLevel` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Position_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPosition` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `positionId` CHAR(36) NOT NULL,
    `isBackup` BOOLEAN NOT NULL DEFAULT false,
    `validFrom` DATE NULL,
    `validUntil` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `picContact` VARCHAR(150) NULL,
    `email` VARCHAR(150) NULL,
    `phone` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Customer_name_key`(`name`),
    UNIQUE INDEX `Customer_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectCategory` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `requiresLphs` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectStatusDefinition` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `color` VARCHAR(7) NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `isTerminal` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectStatusDefinition_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalLevelDefinition` (
    `id` CHAR(36) NOT NULL,
    `level` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `ApprovalLevelDefinition_level_key`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentTypeDefinition` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `appliesToStage` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `DocumentTypeDefinition_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Competitor` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `shortCode` VARCHAR(20) NULL,
    `businessField` VARCHAR(150) NULL,
    `description` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Competitor_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionType` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QuestionType_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionTypeOption` (
    `id` CHAR(36) NOT NULL,
    `questionTypeId` CHAR(36) NOT NULL,
    `optionLabel` VARCHAR(200) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` CHAR(36) NOT NULL,
    `text` TEXT NOT NULL,
    `questionTypeId` CHAR(36) NOT NULL,
    `context` VARCHAR(20) NOT NULL,
    `categoryLabel` VARCHAR(150) NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionOption` (
    `id` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NOT NULL,
    `optionLabel` VARCHAR(200) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeriodDefinition` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holiday` (
    `id` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `description` VARCHAR(200) NOT NULL,
    `isRecurringAnnually` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Holiday_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LossReason` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(150) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LossReason_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prospect` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `customerId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `description` TEXT NULL,
    `estimatedValue` DECIMAL(18, 2) NULL,
    `estimatedDate` DATE NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'prospecting',
    `convertedToProjectId` CHAR(36) NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Prospect_convertedToProjectId_key`(`convertedToProjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProspectAnswer` (
    `id` CHAR(36) NOT NULL,
    `prospectId` CHAR(36) NOT NULL,
    `questionId` CHAR(36) NOT NULL,
    `answerText` TEXT NULL,
    `answerOptionId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProspectAnswer_prospectId_questionId_key`(`prospectId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProspectAnswerOption` (
    `id` CHAR(36) NOT NULL,
    `prospectAnswerId` CHAR(36) NOT NULL,
    `questionOptionId` CHAR(36) NOT NULL,

    UNIQUE INDEX `ProspectAnswerOption_prospectAnswerId_questionOptionId_key`(`prospectAnswerId`, `questionOptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProspectReviewQuestion` (
    `id` CHAR(36) NOT NULL,
    `prospectId` CHAR(36) NOT NULL,
    `reviewRound` INTEGER NOT NULL,
    `questionText` TEXT NOT NULL,
    `answerText` TEXT NULL,
    `createdBy` CHAR(36) NOT NULL,
    `answeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProspectReviewNote` (
    `id` CHAR(36) NOT NULL,
    `prospectId` CHAR(36) NOT NULL,
    `reviewRound` INTEGER NOT NULL,
    `noteText` TEXT NOT NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` CHAR(36) NOT NULL,
    `prospectId` CHAR(36) NULL,
    `name` VARCHAR(200) NOT NULL,
    `projectType` VARCHAR(20) NOT NULL,
    `customerId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `categoryId` CHAR(36) NOT NULL,
    `statusId` CHAR(36) NOT NULL,
    `deadlineTender` DATE NULL,
    `tenderNumber` VARCHAR(100) NULL,
    `tenderName` VARCHAR(200) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancellationReason` TEXT NULL,
    `cancelledBy` CHAR(36) NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Project_prospectId_key`(`prospectId`),
    UNIQUE INDEX `Project_customerId_tenderNumber_key`(`customerId`, `tenderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectTimelineEvent` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `eventType` VARCHAR(100) NOT NULL,
    `actorId` CHAR(36) NULL,
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rks` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
    `revisionNumber` INTEGER NOT NULL DEFAULT 1,
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Rks_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RksReviewQuestion` (
    `id` CHAR(36) NOT NULL,
    `rksId` CHAR(36) NOT NULL,
    `reviewRound` INTEGER NOT NULL,
    `questionText` TEXT NOT NULL,
    `answerText` TEXT NULL,
    `createdBy` CHAR(36) NOT NULL,
    `answeredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RksReviewNote` (
    `id` CHAR(36) NOT NULL,
    `rksId` CHAR(36) NOT NULL,
    `reviewRound` INTEGER NOT NULL,
    `noteText` TEXT NOT NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LphsSios` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
    `linkLphsExternal` TEXT NULL,
    `pmApprovalStatus` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `pmApprovedAt` DATETIME(3) NULL,
    `pmApprovedBy` CHAR(36) NULL,
    `finalApprovalStatus` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `finalApprovedAt` DATETIME(3) NULL,
    `finalApprovedBy` CHAR(36) NULL,
    `revisionNumber` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LphsSios_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LphsDepartmentReview` (
    `id` CHAR(36) NOT NULL,
    `lphsSiosId` CHAR(36) NOT NULL,
    `departmentId` CHAR(36) NOT NULL,
    `approvalStatus` VARCHAR(30) NOT NULL DEFAULT 'reviewing',
    `comment` TEXT NULL,
    `reviewedBy` CHAR(36) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LphsDepartmentReview_lphsSiosId_departmentId_key`(`lphsSiosId`, `departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LphsTargetedRevision` (
    `id` CHAR(36) NOT NULL,
    `lphsSiosId` CHAR(36) NOT NULL,
    `revisionNumber` INTEGER NOT NULL,
    `initiatedBy` CHAR(36) NOT NULL,
    `initiatedRole` VARCHAR(20) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LphsTargetedRevisionDepartment` (
    `id` CHAR(36) NOT NULL,
    `lphsTargetedRevisionId` CHAR(36) NOT NULL,
    `departmentId` CHAR(36) NOT NULL,

    UNIQUE INDEX `LphsTargetedRevisionDepartment_lphsTargetedRevisionId_depart_key`(`lphsTargetedRevisionId`, `departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriceSubmission` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `ourPrice` DECIMAL(18, 2) NOT NULL,
    `marginPercentage` DECIMAL(5, 2) NULL,
    `note` TEXT NULL,
    `referenceLink` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PriceSubmission_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectCompetitor` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `competitorId` CHAR(36) NOT NULL,
    `competitorPrice` DECIMAL(18, 2) NULL,
    `advantageNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProjectCompetitor_projectId_competitorId_key`(`projectId`, `competitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenderResult` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `result` VARCHAR(10) NOT NULL,
    `finalPrice` DECIMAL(18, 2) NULL,
    `lossReasonId` CHAR(36) NULL,
    `lossReasonNote` TEXT NULL,
    `decidedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TenderResult_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeliveryTarget` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `picName` VARCHAR(150) NOT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeliveryTarget_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalWorkflowStage` (
    `id` CHAR(36) NOT NULL,
    `stageCode` VARCHAR(100) NOT NULL,
    `label` VARCHAR(150) NOT NULL,
    `approverRoleId` CHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL,
    `isParallel` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ApprovalWorkflowStage_stageCode_key`(`stageCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Approval` (
    `id` CHAR(36) NOT NULL,
    `resourceType` VARCHAR(30) NOT NULL,
    `resourceId` CHAR(36) NOT NULL,
    `stageId` CHAR(36) NOT NULL,
    `assignedToUserId` CHAR(36) NULL,
    `assignedToRoleId` CHAR(36) NULL,
    `assignedToDepartmentId` CHAR(36) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `decisionComment` TEXT NULL,
    `decidedBy` CHAR(36) NULL,
    `decidedAt` DATETIME(3) NULL,
    `slaDeadline` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalReassignment` (
    `id` CHAR(36) NOT NULL,
    `approvalId` CHAR(36) NOT NULL,
    `previousAssigneeUserId` CHAR(36) NULL,
    `newAssigneeUserId` CHAR(36) NOT NULL,
    `reason` TEXT NOT NULL,
    `reassignedBy` CHAR(36) NOT NULL,
    `reassignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BackupApproverDelegation` (
    `id` CHAR(36) NOT NULL,
    `positionId` CHAR(36) NOT NULL,
    `primaryUserId` CHAR(36) NOT NULL,
    `backupUserId` CHAR(36) NOT NULL,
    `validFrom` DATE NOT NULL,
    `validUntil` DATE NOT NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` CHAR(36) NOT NULL,
    `documentTypeId` CHAR(36) NOT NULL,
    `resourceType` VARCHAR(30) NOT NULL,
    `resourceId` CHAR(36) NOT NULL,
    `departmentId` CHAR(36) NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileSizeBytes` BIGINT NOT NULL,
    `mimeType` VARCHAR(150) NOT NULL,
    `storagePath` TEXT NOT NULL,
    `versionNumber` INTEGER NOT NULL DEFAULT 1,
    `isLatestVersion` BOOLEAN NOT NULL DEFAULT true,
    `uploadedBy` CHAR(36) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiDefinition` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `formulaDescription` TEXT NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KpiDefinition_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KpiWeight` (
    `id` CHAR(36) NOT NULL,
    `kpiDefinitionId` CHAR(36) NOT NULL,
    `weightPercentage` DECIMAL(5, 2) NOT NULL,
    `effectiveFrom` DATE NOT NULL,
    `effectiveUntil` DATE NULL,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Target` (
    `id` CHAR(36) NOT NULL,
    `kpiDefinitionId` CHAR(36) NOT NULL,
    `scopeType` VARCHAR(20) NOT NULL,
    `scopeId` CHAR(36) NOT NULL,
    `periodId` CHAR(36) NOT NULL,
    `targetValue` DECIMAL(18, 2) NOT NULL,
    `versionNumber` INTEGER NOT NULL DEFAULT 1,
    `isCurrentVersion` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TargetProgressSnapshot` (
    `id` CHAR(36) NOT NULL,
    `targetId` CHAR(36) NOT NULL,
    `snapshotDate` DATE NOT NULL,
    `actualValue` DECIMAL(18, 2) NOT NULL,
    `percentageAchieved` DECIMAL(6, 2) NOT NULL,
    `trafficLightStatus` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TargetProgressSnapshot_targetId_snapshotDate_key`(`targetId`, `snapshotDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationTemplate` (
    `id` CHAR(36) NOT NULL,
    `eventCode` VARCHAR(100) NOT NULL,
    `templateText` TEXT NOT NULL,
    `channel` VARCHAR(20) NOT NULL DEFAULT 'in_app',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationTemplate_eventCode_key`(`eventCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationTemplateRecipient` (
    `id` CHAR(36) NOT NULL,
    `notificationTemplateId` CHAR(36) NOT NULL,
    `recipientRoleId` CHAR(36) NULL,
    `recipientDepartmentId` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` CHAR(36) NOT NULL,
    `notificationTemplateId` CHAR(36) NOT NULL,
    `recipientUserId` CHAR(36) NOT NULL,
    `resourceType` VARCHAR(50) NULL,
    `resourceId` CHAR(36) NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` CHAR(36) NOT NULL,
    `actorId` CHAR(36) NULL,
    `actorRoleSnapshot` VARCHAR(50) NOT NULL,
    `action` VARCHAR(150) NOT NULL,
    `resourceType` VARCHAR(50) NULL,
    `resourceId` CHAR(36) NULL,
    `branchIdSnapshot` CHAR(36) NULL,
    `ipAddress` VARCHAR(45) NOT NULL,
    `userAgent` TEXT NULL,
    `payloadBefore` JSON NULL,
    `payloadAfter` JSON NULL,
    `metadata` JSON NULL,
    `result` VARCHAR(20) NOT NULL,
    `errorCode` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SlaConfiguration` (
    `id` CHAR(36) NOT NULL,
    `stageId` CHAR(36) NOT NULL,
    `slaWorkingDays` INTEGER NOT NULL,
    `isEnforcementActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SlaConfiguration_stageId_key`(`stageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SlaReminderConfiguration` (
    `id` CHAR(36) NOT NULL,
    `slaConfigurationId` CHAR(36) NOT NULL,
    `reminderDaysBefore` INTEGER NOT NULL,
    `escalationRoleId` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UploadPolicyConfiguration` (
    `id` CHAR(36) NOT NULL,
    `documentTypeId` CHAR(36) NOT NULL,
    `maxSizeMb` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UploadPolicyConfiguration_documentTypeId_key`(`documentTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UploadPolicyMimeType` (
    `id` CHAR(36) NOT NULL,
    `uploadPolicyConfigurationId` CHAR(36) NOT NULL,
    `mimeType` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `UploadPolicyMimeType_uploadPolicyConfigurationId_mimeType_key`(`uploadPolicyConfigurationId`, `mimeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationConfiguration` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `valueEncrypted` TEXT NOT NULL,
    `isSecret` BOOLEAN NOT NULL DEFAULT false,
    `updatedBy` CHAR(36) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IntegrationConfiguration_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiRequestLog` (
    `id` CHAR(36) NOT NULL,
    `requestedBy` CHAR(36) NOT NULL,
    `featureCode` VARCHAR(50) NOT NULL,
    `resourceType` VARCHAR(50) NULL,
    `resourceId` CHAR(36) NULL,
    `provider` VARCHAR(50) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `latencyMs` INTEGER NULL,
    `errorCode` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
