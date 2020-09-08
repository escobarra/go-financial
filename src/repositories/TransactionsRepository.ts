import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const income = transactions.reduce((_total, transaction) => {
      if (transaction.type === 'income')
        return _total + Number(transaction.value);
      return _total;
    }, 0);

    const outcome = transactions.reduce((_total, transaction) => {
      if (transaction.type === 'outcome')
        return _total + Number(transaction.value);
      return _total;
    }, 0);

    const total: number = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
