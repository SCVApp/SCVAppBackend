import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObdobjeUre } from '../entities/obdobjeUre.entity';
import { Razred } from '../entities/razred.entity';
import { Ura } from '../entities/ura.entity';

@Injectable()
export class CacheService {
  constructor(
    @InjectRepository(Razred)
    private razredRepository: Repository<Razred>,
    @InjectRepository(ObdobjeUre)
    private obdobjeUreRepository: Repository<ObdobjeUre>,
    @InjectRepository(Ura)
    private uraRepository: Repository<Ura>,
  ) {}

  async getRazred(name: string, id_sole: string) {
    return await this.razredRepository.findOne({ where: { name, id_sole } });
  }

  async getUrnik(name: string, id_sole: string) {
    const razred = await this.getRazred(name, id_sole);
    if (!razred) return null;
    const UpdateDate = razred.updated_at;
    const now = new Date();
    const enakDan = UpdateDate.getDate() === now.getDate();
    const enakMesec = UpdateDate.getMonth() === now.getMonth();
    const enakLeto = UpdateDate.getFullYear() === now.getFullYear();
    if (enakDan && enakMesec && enakLeto) {
      return razred.urnik;
    }
    return null;
  }

  async saveOrUpdateRazred(urnik: ObdobjeUre[], name: string, id_sole: string) {
    if (name === '' || id_sole === '') return;
    const razred = await this.getRazred(name, id_sole);
    const filterUrnik = urnik.filter((obdobje) => {
      const praznaUra = obdobje.ura.find((ura) => {
        if (
          ura.dogodek === '' &&
          ura.krajsava === '' &&
          ura.ucilnica === '' &&
          ura.ucitelj === ''
        )
          return true;
        return false;
      });
      if (praznaUra) return false;
      if (obdobje.ura.length === 0) return false;
      return true;
    });
    if (!razred) {
      await this.razredRepository.save({
        name,
        id_sole,
        urnik: filterUrnik,
        updated_at: new Date(),
      });
    } else {
      await this.obdobjeUreRepository.remove(razred.urnik);
      razred.urnik = filterUrnik;
      razred.updated_at = new Date();
      await this.razredRepository.save(razred);
    }
  }
}
