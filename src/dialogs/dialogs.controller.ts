import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateDialogResponseDto } from "./dto/create-dialog-response.dto";
import { CreateDialogDto } from "./dto/create-dialog.dto";
import { DialogsService } from "./dialogs.service";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

@ApiTags("Dialogs")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("dialogs")
export class DialogsController {
  constructor(private readonly dialogsService: DialogsService) {}

  @ApiOperation({
    summary: "Создать диалог",
    description:
      "Студент создаёт диалог с преподавателем и загружает первую версию работы. " +
      "Одновременно создаётся Submission v1 и запись File с путём к сохранённому файлу.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["teacherId", "title", "file"],
      properties: {
        teacherId: { type: "string", format: "uuid" },
        title: { type: "string", example: "Курсовая работа по алгоритмам" },
        comment: { type: "string", example: "Первая версия" },
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiCreatedResponse({ type: CreateDialogResponseDto })
  @ApiUnauthorizedResponse({ description: "Требуется авторизация" })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  create(
    @Request() req,
    @Body() dto: CreateDialogDto,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
  ): Promise<CreateDialogResponseDto> {
    return this.dialogsService.create(req.user.userId, dto, file);
  }
}
