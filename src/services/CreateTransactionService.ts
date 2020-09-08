import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    let cat = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!cat) {
      cat = await categoriesRepository.create({ title: category });
      await categoriesRepository.save(cat);
    }

    if (type === 'outcome' && balance.total - value < 0) {
      throw new AppError('Negative Balance', 400);
    }

    const transaction = await transactionsRepository.create({
      title,
      type,
      value,
      category_id: cat.id,
    });
    transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
