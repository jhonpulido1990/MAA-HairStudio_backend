import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsIn,
  Length,
  Matches,
  IsEnum,
} from 'class-validator';
import {
  ARGENTINA_PROVINCES,
  ArgentinaProvince,
} from '../constants/argentina-locations';

export class CreateAddressDto {
  @IsString({ message: 'El nombre del destinatario debe ser texto' })
  @Length(2, 100, {
    message: 'El nombre debe tener entre 2 y 100 caracteres',
  })
  recipientName: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @Matches(
    /^(\+54|54)?[0-9]{8,12}$/,
    {
      message: 'El teléfono debe tener formato argentino válido (+541123456789)',
    },
  )
  phone: string;

  @IsOptional()
  @IsString({ message: 'El teléfono alternativo debe ser texto' })
  @Matches(
    /^(\+54|54)?[0-9]{8,12}$/,
    {
      message: 'El teléfono alternativo debe tener formato argentino válido',
    },
  )
  alternativePhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email?: string;

  @IsString({ message: 'La provincia debe ser texto' })
  @IsIn(ARGENTINA_PROVINCES, {
    message: 'Debe ser una provincia válida de Argentina',
  })
  province: ArgentinaProvince; // ✅ Cambio de department a province

  @IsString({ message: 'La ciudad debe ser texto' })
  @Length(2, 50, { message: 'La ciudad debe tener entre 2 y 50 caracteres' })
  city: string;

  @IsString({ message: 'El código postal debe ser texto' })
  @Matches(
    /^[A-Z]?\d{4}[A-Z]{0,3}$/,
    {
      message:
        'El código postal debe tener formato argentino válido (ej: C1000AAA o 1000)',
    },
  )
  postalCode: string;

  @IsString({ message: 'La dirección debe ser texto' })
  @Length(5, 200, {
    message: 'La dirección debe tener entre 5 y 200 caracteres',
  })
  streetAddress: string;

  @IsOptional()
  @IsString({ message: 'La línea adicional debe ser texto' })
  @Length(1, 200, {
    message: 'La línea adicional debe tener máximo 200 caracteres',
  })
  addressLine2?: string;

  @IsOptional()
  @IsString({ message: 'El barrio debe ser texto' })
  @Length(1, 100, {
    message: 'El barrio debe tener máximo 100 caracteres',
  })
  neighborhood?: string;

  @IsOptional()
  @IsString({ message: 'El punto de referencia debe ser texto' })
  @Length(1, 200, {
    message: 'El punto de referencia debe tener máximo 200 caracteres',
  })
  landmark?: string;

  @IsOptional()
  @IsString({ message: 'Las instrucciones deben ser texto' })
  @Length(1, 500, {
    message: 'Las instrucciones deben tener máximo 500 caracteres',
  })
  deliveryInstructions?: string;

  @IsOptional()
  @IsString({ message: 'La preferencia de horario debe ser texto' })
  deliveryTimePreference?: string;

  @IsOptional()
  @IsEnum(['Casa', 'Trabajo', 'Otro'], {
    message: 'La etiqueta debe ser: Casa, Trabajo, o Otro',
  })
  label?: 'Casa' | 'Trabajo' | 'Otro';

  @IsOptional()
  @IsBoolean({ message: 'isDefault debe ser true o false' })
  isDefault?: boolean = false;
}
