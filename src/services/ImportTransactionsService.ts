import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParser from 'csv-parse';
import fs from 'fs';
import path from 'path';
import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  csvFilename: string;
}

interface CsvDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ csvFilename }: Request): Promise<Transaction[]> {
    const parsers = csvParser({ from_line: 2 });
    const categories: string[] = [];
    const transactions: CsvDTO[] = [];

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    // lets check if we can find uploaded file
    const csvFilePath = path.join(uploadConfig.directory, csvFilename);
    const csvFileExists = await fs.promises.stat(csvFilePath);
    if (!csvFileExists) {
      throw new AppError('Unable to find uploaded file', 404);
    }

    const csvStream = fs.createReadStream(csvFilePath);
    const csvParse = csvStream.pipe(parsers).on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    // wait for promisse resolve
    await new Promise(resolve => csvParse.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      category => category.title,
    );

    const toBeAddedCategories = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index); // eliminate duplicate

    const newCategories = categoriesRepository.create(
      toBeAddedCategories.map(title => ({ title })),
    );
    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const allTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await fs.promises.unlink(csvFilePath); // delete file
    return transactionsRepository.save(allTransactions);
  } // end of execute method
}

export default ImportTransactionsService;
