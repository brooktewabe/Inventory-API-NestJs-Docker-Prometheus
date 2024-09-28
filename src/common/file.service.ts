import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private baseDir: string = path.join(__dirname, '../..', 'uploads');

  constructor() {
    this.ensureDirectoryExists(this.baseDir);
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (error) {
        throw new InternalServerErrorException('Failed to create directory');
      }
    }
  }

  public saveFile(file: Express.Multer.File, folder: string): string {
    const uploadPath = path.join(this.baseDir, folder);
    this.ensureDirectoryExists(uploadPath);

    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(uploadPath, uniqueFileName);

    try {
      fs.writeFileSync(filePath, file.buffer);
    } catch (error) {
      throw new InternalServerErrorException('Failed to save file');
    }
    
    return filePath;
  }
}