import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressDto1 } from './create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto1) {
  // You can add additional properties or methods here if needed
}
