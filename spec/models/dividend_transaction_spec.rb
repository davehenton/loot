require 'rails_helper'

RSpec.describe DividendTransaction, :type => :model do
	matcher :match_json do |expected, investment_account, cash_account|
		match do |actual|
			actual.transaction_type.eql? "Dividend" and \
			actual.id.eql? expected[:id] and \
			actual.amount.eql? expected['amount'] and \
			actual.memo.eql? expected['memo'] and \
			actual.investment_account.direction.eql? "outflow" and \
			actual.investment_account.account.eql? investment_account and \
			actual.cash_account.direction.eql? "inflow" and \
			actual.cash_account.account.eql? cash_account
		end
	end

	describe "::create_from_json" do
		let(:investment_account) { create :investment_account }
		let(:cash_account) { create :bank_account }
		let(:json) { {
			:id => 1,
			"amount" => 1,
			"memo" => "Test json",
			"primary_account" => {
				"id" => investment_account.id
			},
			"account" => {
				"id" => cash_account.id
			}
		} }

		before :each do
			expect(Account).to receive(:find).with(json['primary_account']['id']).and_return investment_account
			expect(Account).to receive(:find).with(json['account']['id']).and_return cash_account
			expect_any_instance_of(SecurityTransactionHeader).to receive(:update_from_json).with json
		end

		it "should create a transaction from a JSON representation" do
			expect(DividendTransaction.create_from_json(json)).to match_json json, investment_account, cash_account
		end
	end

	describe "::update_from_json" do
		let(:investment_account) { create :investment_account }
		let(:cash_account) { create :bank_account }
		let(:transaction) { create :dividend_transaction }
		let(:json) { {
			:id => transaction.id,
			"amount" => 1,
			"memo" => "Test json",
			"primary_account" => {
				"id" => investment_account.id
			},
			"account" => {
				"id" => cash_account.id
			}
		} }

		before :each do
			expect(DividendTransaction).to receive_message_chain(:includes, :find).with(json[:id]).and_return transaction
			expect(Account).to receive(:find).with(json['primary_account']['id']).and_return investment_account
			expect(Account).to receive(:find).with(json['account']['id']).and_return cash_account
			expect(transaction.header).to receive(:update_from_json).with json
		end

		it "should update a transaction from a JSON representation" do
			expect(DividendTransaction.update_from_json(json)).to match_json json, investment_account, cash_account
		end
	end

	describe "#as_json" do
		subject { create(:dividend_transaction, status: "Reconciled") }

		before :each do
			expect(subject.investment_account.account).to receive(:as_json).and_return("investment account json")
			expect(subject.cash_account.account).to receive(:as_json).and_return("cash account json")
		end

		context "for investment account" do
			let(:json) { subject.as_json }

			it "should return a JSON representation" do
				expect(json).to include(:primary_account => "investment account json")
				expect(json).to include(:category => {:id => "DividendTo", :name => "Dividend To"})
				expect(json).to include(:account => "cash account json")
				expect(json).to include(:direction => "outflow")
			end
		end

		context "for cash account" do
			let(:json) { subject.as_json({:primary_account => subject.cash_account.account_id}) }

			it "should return a JSON representation" do
				expect(json).to include(:primary_account => "cash account json")
				expect(json).to include(:category => {:id => "DividendFrom", :name => "Dividend From"})
				expect(json).to include(:account => "investment account json")
				expect(json).to include(:direction => "inflow")
			end
		end

		after :each do
			expect(json).to include(:amount => 1)
			expect(json).to include(:status => "Reconciled")
		end
	end

	describe "#investment_account" do
		let(:account) { create :investment_account }
		subject { create :dividend_transaction, investment_account: account }

		it "should return the first account of type 'investment'" do
			expect(subject.investment_account.account).to eq account
		end
	end

	describe "#cash_account" do
		let(:account) { create :bank_account }
		subject { create :dividend_transaction, cash_account: account }

		it "should return the first account of type 'bank'" do
			expect(subject.cash_account.account).to eq account
		end
	end
end