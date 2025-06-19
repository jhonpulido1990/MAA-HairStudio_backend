import {
  IsString,
  IsOptional,
  IsEmail,
  Length,
  IsPhoneNumber,
  IsNotEmpty,
} from 'class-validator';

export class CreateAddressDto {
  @IsString({
    message: 'El nombre es obligatorio y debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  name: string;

  @IsString({
    message: 'La dirección es obligatoria y debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'La dirección no puede estar vacía.' })
  street1: string;

  @IsString({
    message: 'La segunda dirección debe ser una cadena de texto.',
  })
  @IsOptional()
  street2?: string;

  @IsString({
    message: 'La ciudad es obligatoria y debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'La ciudad no puede estar vacía.' })
  city: string;

  @IsString({
    message: 'El estado es obligatorio y debe ser una cadena de texto.',
  })
  @IsNotEmpty({ message: 'El estado no puede estar vacío.' })
  state: string;

  @IsString({
    message: 'El código postal es obligatorio y debe ser una cadena de texto.',
  })
  @Length(3, 10, {
    message: 'El código postal debe tener entre 3 y 10 caracteres.',
  })
  @IsNotEmpty({ message: 'El código postal no puede estar vacío.' })
  zip: string;

  @IsString({
    message: 'El país es obligatorio y debe ser una cadena de texto.',
  })
  @Length(2, 2, {
    message: 'El país debe tener un código de 2 letras (ISO 3166-1 alpha-2).',
  })
  @IsNotEmpty({ message: 'El país no puede estar vacío.' })
  country: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsPhoneNumber(undefined, {
    message: 'El teléfono solo puede contener números y símbolos válidos.',
  })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  email?: string;
}
