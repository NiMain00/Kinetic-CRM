import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export class RksService {
  async getByProject(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    const rks = await prisma.rks.findUnique({
      where: { projectId },
      include: {
        reviewQuestions: { orderBy: { createdAt: 'asc' } },
        reviewNotes: { orderBy: { createdAt: 'asc' } },
      },
    });

    return rks;
  }

  async create(projectId: string, data: { content: string; attachmentIds?: string[] }, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.deletedAt) {
      throw new AppError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan.');
    }

    const existing = await prisma.rks.findUnique({ where: { projectId } });
    if (existing) {
      throw new AppError(409, 'RKS_ALREADY_EXISTS', 'RKS untuk proyek ini sudah ada. Gunakan endpoint update.');
    }

    const rks = await prisma.rks.create({
      data: {
        projectId,
        content: data.content,
        status: 'draft',
        revisionNumber: 1,
      },
      include: {
        reviewQuestions: { orderBy: { createdAt: 'asc' } },
        reviewNotes: { orderBy: { createdAt: 'asc' } },
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId,
        eventType: 'rks_created',
        actorId: userId,
        description: 'Dokumen RKS dibuat.',
      },
    });

    return rks;
  }

  async update(id: string, data: { content?: string; status?: string }) {
    const rks = await prisma.rks.findUnique({ where: { id } });
    if (!rks) {
      throw new AppError(404, 'RKS_NOT_FOUND', 'RKS tidak ditemukan.');
    }

    if (rks.status !== 'draft') {
      throw new AppError(400, 'RKS_NOT_EDITABLE', 'RKS hanya bisa diedit dalam status draft.');
    }

    const updated = await prisma.rks.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        reviewQuestions: { orderBy: { createdAt: 'asc' } },
        reviewNotes: { orderBy: { createdAt: 'asc' } },
      },
    });

    return updated;
  }

  async submit(id: string, userId: string) {
    const rks = await prisma.rks.findUnique({ where: { id } });
    if (!rks) {
      throw new AppError(404, 'RKS_NOT_FOUND', 'RKS tidak ditemukan.');
    }

    if (rks.status !== 'draft') {
      throw new AppError(400, 'RKS_INVALID_STATUS', 'Hanya RKS draft yang bisa disubmit.');
    }

    const updated = await prisma.rks.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
      },
      include: {
        reviewQuestions: { orderBy: { createdAt: 'asc' } },
        reviewNotes: { orderBy: { createdAt: 'asc' } },
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: rks.projectId,
        eventType: 'rks_submitted',
        actorId: userId,
        description: 'RKS disubmit untuk review.',
      },
    });

    return updated;
  }

  async approve(id: string, userId: string, data?: { comment?: string }) {
    const rks = await prisma.rks.findUnique({ where: { id } });
    if (!rks) {
      throw new AppError(404, 'RKS_NOT_FOUND', 'RKS tidak ditemukan.');
    }

    if (rks.status !== 'submitted') {
      throw new AppError(400, 'RKS_INVALID_STATUS', 'Hanya RKS yang sudah disubmit yang bisa di-approve.');
    }

    const updated = await prisma.rks.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
      },
      include: {
        reviewQuestions: { orderBy: { createdAt: 'asc' } },
        reviewNotes: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (data?.comment) {
      await prisma.rksReviewNote.create({
        data: {
          rksId: id,
          reviewRound: rks.revisionNumber,
          noteText: data.comment,
          createdBy: userId,
        },
      });
    }

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: rks.projectId,
        eventType: 'rks_approved',
        actorId: userId,
        description: 'RKS telah disetujui.',
      },
    });

    return updated;
  }

  async reject(id: string, userId: string, data: { comment: string }) {
    const rks = await prisma.rks.findUnique({ where: { id } });
    if (!rks) {
      throw new AppError(404, 'RKS_NOT_FOUND', 'RKS tidak ditemukan.');
    }

    if (rks.status !== 'submitted') {
      throw new AppError(400, 'RKS_INVALID_STATUS', 'Hanya RKS yang sudah disubmit yang bisa di-reject.');
    }

    const updated = await prisma.rks.update({
      where: { id },
      data: {
        status: 'draft',
        revisionNumber: rks.revisionNumber + 1,
      },
      include: {
        reviewQuestions: { orderBy: { createdAt: 'asc' } },
        reviewNotes: { orderBy: { createdAt: 'asc' } },
      },
    });

    await prisma.rksReviewNote.create({
      data: {
        rksId: id,
        reviewRound: updated.revisionNumber,
        noteText: data.comment,
        createdBy: userId,
      },
    });

    await prisma.projectTimelineEvent.create({
      data: {
        projectId: rks.projectId,
        eventType: 'rks_rejected',
        actorId: userId,
        description: `RKS ditolak: ${data.comment}`,
      },
    });

    return updated;
  }

  async addReviewQuestion(rksId: string, data: { questionText: string }, userId: string) {
    const rks = await prisma.rks.findUnique({ where: { id: rksId } });
    if (!rks) {
      throw new AppError(404, 'RKS_NOT_FOUND', 'RKS tidak ditemukan.');
    }

    const question = await prisma.rksReviewQuestion.create({
      data: {
        rksId,
        reviewRound: rks.revisionNumber,
        questionText: data.questionText,
        createdBy: userId,
      },
    });

    return question;
  }

  async answerReviewQuestion(questionId: string, data: { answerText: string }, userId: string) {
    const question = await prisma.rksReviewQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
      throw new AppError(404, 'RKS_QUESTION_NOT_FOUND', 'Pertanyaan review tidak ditemukan.');
    }

    const updated = await prisma.rksReviewQuestion.update({
      where: { id: questionId },
      data: {
        answerText: data.answerText,
        answeredAt: new Date(),
      },
    });

    return updated;
  }

  async addReviewNote(rksId: string, data: { noteText: string }, userId: string) {
    const rks = await prisma.rks.findUnique({ where: { id: rksId } });
    if (!rks) {
      throw new AppError(404, 'RKS_NOT_FOUND', 'RKS tidak ditemukan.');
    }

    const note = await prisma.rksReviewNote.create({
      data: {
        rksId,
        reviewRound: rks.revisionNumber,
        noteText: data.noteText,
        createdBy: userId,
      },
    });

    return note;
  }
}
