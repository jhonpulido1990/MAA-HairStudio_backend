import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  name: string;

  @IsEmail(
    {},
    {
      message:
        'Por favor, proporciona una dirección de correo electrónico válida.',
    },
  )
  @IsNotEmpty({ message: 'El correo electrónico no debe estar vacío.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña no debe estar vacía.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password: string;
}
