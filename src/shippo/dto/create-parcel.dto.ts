import {
  IsIn,
  IsNotEmpty,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Validador custom para strings que representan números positivos
@ValidatorConstraint({ name: 'IsPositiveStringNumber', async: false })
export class IsPositiveStringNumber implements ValidatorConstraintInterface {
  validate(value: string) {
    const num = Number(value);
    return (
      typeof value === 'string' && value.trim() !== '' && !isNaN(num) && num > 0
    );
  }
  defaultMessage() {
    return 'El valor debe ser un string que representa un número mayor que cero.';
  }
}

export class CreateParcelDto {
  @IsString({ message: 'El largo debe ser un texto.' })
  @IsNotEmpty({ message: 'El largo no puede estar vacío.' })
  @Validate(IsPositiveStringNumber, {
    message: 'El largo debe ser un número mayor que cero.',
  })
  length: string;

  @IsString({ message: 'El ancho debe ser un texto.' })
  @IsNotEmpty({ message: 'El ancho no puede estar vacío.' })
  @Validate(IsPositiveStringNumber, {
    message: 'El ancho debe ser un número mayor que cero.',
  })
  width: string;

  @IsString({ message: 'La altura debe ser un texto.' })
  @IsNotEmpty({ message: 'La altura no puede estar vacía.' })
  @Validate(IsPositiveStringNumber, {
    message: 'La altura debe ser un número mayor que cero.',
  })
  height: string;

  @IsIn(['cm', 'in', 'ft', 'm'], {
    message:
      'La unidad de distancia debe ser una de las siguientes: cm, in, ft, m.',
  })
  distanceUnit: string;

  @IsString({ message: 'El peso debe ser un texto.' })
  @IsNotEmpty({ message: 'El peso no puede estar vacío.' })
  @Validate(IsPositiveStringNumber, {
    message: 'El peso debe ser un número mayor que cero.',
  })
  weight: string;

  @IsIn(['g', 'kg', 'oz', 'lb'], {
    message: 'La unidad de masa debe ser una de las siguientes: g, kg, oz, lb.',
  })
  massUnit: string;
}
