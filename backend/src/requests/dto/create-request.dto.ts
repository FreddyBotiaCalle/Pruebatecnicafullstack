import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'El texto no puede estar vacío' })
  @MaxLength(1000, { message: 'El texto no puede superar los 1000 caracteres' })
  text: string;
}
