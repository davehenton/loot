# Copyright (c) 2016 Scott O'Hara, oharagroup.net
# frozen_string_literal: true

FactoryGirl.define do
	factory :security_transfer_transaction do
		# Default attributes for security transaction
		security_transaction

		# Default accounts if none specified
		transient do
			source_account { FactoryGirl.build :investment_account }
			destination_account { FactoryGirl.build :investment_account }
			quantity 10
			status nil
		end

		after :build do |trx, evaluator|
			trx.header.quantity = evaluator.quantity
			trx.source_transaction_account = FactoryGirl.build :transaction_account, account: evaluator.source_account, direction: 'outflow', status: evaluator.status
			trx.destination_transaction_account = FactoryGirl.build :transaction_account, account: evaluator.destination_account, direction: 'inflow'
		end

		trait :scheduled do
			transient do
				next_due_date { Time.zone.tomorrow.advance months: -1 }
			end

			after :build do |trx, evaluator|
				trx.header.transaction_date = nil
				trx.header.schedule = build :schedule, next_due_date: evaluator.next_due_date
			end
		end
	end
end
