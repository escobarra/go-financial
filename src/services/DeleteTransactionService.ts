import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new AppError('Cant remove this repo. Repo not found.', 404);
    }
    transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
