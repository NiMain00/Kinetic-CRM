import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class GformWebhookDto {
  @IsString()
  @IsOptional()
  form_id?: string;

  @IsString()
  @IsOptional()
  branch_code?: string;

  @IsString()
  @IsOptional()
  submission_id?: string;

  @IsString()
  @IsOptional()
  submitted_at?: string;

  @IsObject()
  @IsNotEmpty({ message: 'Jawaban form tidak boleh kosong' })
  answers: Record<string, string>;
}
