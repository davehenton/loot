FactoryGirl.define do
	factory :payee do
		sequence(:name) { |n| "Payee #{n}" }

		ignore do
			transactions 0
		end

		trait :with_all_transaction_types do
			after :build do |payee|
				create(:basic_expense_transaction, :flagged, payee: payee, status: "Cleared")			#flagged and cleared
				create(:basic_income_transaction, payee: payee)
				create(:transfer_transaction, payee: payee) 
				create(:split_to_transaction, payee: payee, subtransactions: 1, subtransfers: 1)
				create(:split_from_transaction, payee: payee, subtransactions: 1, subtransfers: 1)
				create(:payslip_transaction, payee: payee, subtransactions: 1, subtransfers: 1)
				create(:loan_repayment_transaction, payee: payee, subtransactions: 1, subtransfers: 1)
			end
		end

		after :build do |payee, evaluator|
			create_list :basic_transaction, evaluator.transactions, payee: payee
		end
	end
end
