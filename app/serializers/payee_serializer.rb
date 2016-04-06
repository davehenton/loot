class PayeeSerializer < ActiveModel::Serializer
  attributes :id, :name, :closing_balance, :num_transactions, :favourite

	def num_transactions
		object.transactions.count
	end
end
