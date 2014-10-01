FactoryGirl.define do
	factory :dividend_transaction do
		# Default attributes for security transaction
		security_transaction
		amount

		# Default accounts if none specified
		ignore do
			investment_account { FactoryGirl.build(:investment_account, related_account: cash_account) }
			cash_account { FactoryGirl.build(:bank_account) }
		end

		after :build do |trx, evaluator|
			trx.transaction_accounts << FactoryGirl.build(:transaction_account, account: evaluator.investment_account, direction: "outflow")
			trx.transaction_accounts << FactoryGirl.build(:transaction_account, account: evaluator.cash_account, direction: "inflow")
		end
	end
end