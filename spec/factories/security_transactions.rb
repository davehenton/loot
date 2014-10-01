FactoryGirl.define do
	trait :security_transaction do
		memo

		# Default security if none specified
		ignore do
			security { FactoryGirl.build(:security) }
		end

		after :build do |trx, evaluator|
			trx.header = FactoryGirl.build :security_transaction_header, security: evaluator.security
		end
	end
end