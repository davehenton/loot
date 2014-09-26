FactoryGirl.define do
	factory :basic_transaction do
		# Default attributes for payee cash transaction
		payee_cash_transaction

		# Default account and category if none specified
		ignore do
			account { FactoryGirl.build(:account) }
			category { FactoryGirl.build(:category) }
		end

		after :build do |trx, evaluator|
			trx.transaction_account = FactoryGirl.build :transaction_account, account: evaluator.account
			trx.category = evaluator.category
		end
	end
end
