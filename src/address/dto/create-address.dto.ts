import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsPhoneNumber,
  Length,
} from 'class-validator';

export class CreateAddressDto {
  @IsString({
    message:
      'El nombre completo es obligatorio y debe ser una cadena de texto.',
  })
  nombreCompleto: string;

  @IsPhoneNumber(undefined, { message: 'Teléfono no válido' })
  telefono: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Teléfono alternativo no válido' })
  telefonoAlternativo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString({
    message: 'El país es obligatorio y debe ser una cadena de texto.',
  })
  pais: string;

  @IsString({
    message: 'El departamento es obligatorio y debe ser una cadena de texto.',
  })
  departamento: string;

  @IsString({
    message: 'La ciudad es obligatoria y debe ser una cadena de texto.',
  })
  ciudad: string;

  @IsString()
  @Length(3, 10)
  codigoPostal: string;

  @IsString()
  @Length(5, 100)
  direccionLinea1: string;

  @IsOptional()
  @IsString({ message: 'La dirección línea 2 debe ser una cadena de texto.' })
  direccionLinea2?: string;

  @IsOptional()
  @IsString({ message: 'La referencia debe ser una cadena de texto.' })
  referencia?: string;

  @IsOptional()
  @IsString({ message: 'Las notas de entrega deben ser una cadena de texto.' })
  notasEntrega?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo "esPrincipal" debe ser un valor booleano.' })
  esPrincipal?: boolean;
}
