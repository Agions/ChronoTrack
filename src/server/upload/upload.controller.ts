import { Controller, Post, Response, Get, StreamableFile, UploadedFile, Body, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { SampleDto } from './upload.dto';
@Controller('upload')
export class UploadController {
  @Get('/file')
  getFile(@Response({ passthrough: true }) res): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="package.json"',
    });
    return new StreamableFile(file);
  }
  @Post('/file')
  @UseInterceptors(FilesInterceptor('file'))
  uploadFile(
    @Body() body: SampleDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return {
      body,
      file: file,
    };
  }

}
