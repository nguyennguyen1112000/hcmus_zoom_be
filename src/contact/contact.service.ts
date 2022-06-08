/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { assignPartialsToThis } from 'src/helpers/ultils';
import { Repository } from 'typeorm';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}
  async create(createContactDto: CreateContactDto) {
    try {
      let contact = new Contact();
      assignPartialsToThis(contact, createContactDto);
      await this.contactRepository.save(contact);
      return contact;
    } catch (err) {
      throw err;
    }
  }
}
