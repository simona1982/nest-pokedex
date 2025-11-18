import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PokeResponse, Result } from './interfaces/poke-response.interface';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  // private readonly axios: AxiosInstance = axios;
  private readonly logger = new Logger(SeedService.name);
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly http: AxiosAdapter, // Patron Adaptador
  ) {}

  async executeSeed(): Promise<Result[]> {
    await this.pokemonModel.deleteMany({});

    const {
      data: { results },
    } = await firstValueFrom(
      this.httpService
        .get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650')
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response?.data);
            console.log(error);
            throw new InternalServerErrorException('An error happened!');
          }),
        ),
      // this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650')
    );

    // const insertPromisesArray: Promise<Object>[] = [];
    const pokemonToInsert: { name: string; no: number }[] = [];

    results.forEach(({ name, url }) => {
      const segments = url.split('/');
      const no: number = +segments[segments.length - 2];

      // const pokemon = await this.pokemonModel.create({ no, name });
      // console.log(pokemon);
      // insertPromisesArray.push(this.pokemonModel.create({ no, name }));

      pokemonToInsert.push({ name, no });

      console.log({ no, name });
    });

    // await Promise.all(insertPromisesArray);
    await this.pokemonModel.insertMany(pokemonToInsert);

    console.log(`Seed Executed`);

    return results;
  }
}
