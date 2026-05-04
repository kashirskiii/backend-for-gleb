import { BadRequestException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { basename, dirname, extname, join } from "path";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDialogDto } from "./dto/create-dialog.dto";

@Injectable()
export class DialogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    studentId: string,
    dto: CreateDialogDto,
    file: Express.Multer.File,
  ) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
      select: { id: true, role: true },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new BadRequestException("Teacher not found");
    }

    // Pre-generate IDs so the file path can be built before the DB write
    const dialogId = randomUUID();
    const submissionId = randomUUID();

    const safeFilename = this.sanitizeFilename(file.originalname);
    // Path layout: uploads/dialogs/{dialogId}/submissions/{submissionId}/{filename}
    const relativePath = `uploads/dialogs/${dialogId}/submissions/${submissionId}/${safeFilename}`;
    const absolutePath = join(process.cwd(), relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const [dialog, submission, fileRecord] = await this.prisma.$transaction(
      async (tx) => {
        const dialog = await tx.dialog.create({
          data: { id: dialogId, studentId, teacherId: dto.teacherId, title: dto.title },
        });

        const submission = await tx.submission.create({
          data: {
            id: submissionId,
            dialogId: dialog.id,
            version: 1,
            comment: dto.comment ?? null,
          },
        });

        const fileRecord = await tx.file.create({
          data: {
            submissionId: submission.id,
            originalName: file.originalname,
            path: relativePath,
            mimeType: file.mimetype,
            size: file.size,
          },
        });

        return [dialog, submission, fileRecord] as const;
      },
    );

    return { dialog, submission, file: fileRecord };
  }

  private sanitizeFilename(originalName: string): string {
    const ext = extname(originalName);
    const name = basename(originalName, ext);
    const safe = name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 100) || "file";
    return `${safe}${ext}`;
  }
}
