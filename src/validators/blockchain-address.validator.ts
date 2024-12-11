import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ethers } from 'ethers';

export function IsBlockchainAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBlockchainAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;
          return ethers.isAddress(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid blockchain address`;
        },
      },
    });
  };
}
