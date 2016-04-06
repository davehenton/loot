class PayeesController < ApplicationController
	respond_to :json

	def index
		sort = [:name]

		# Only first by favourite for typeaheads
		sort.unshift favourite: :desc unless params.has_key? :list

		respond_with Payee.order(*sort), except: [:closing_balance, :num_transactions]
	end

	def show
		respond_with Payee.find params[:id]
	end

	def create
		render json: Payee.create(name: params['name'])
	end

	def update
		payee = Payee.find params[:id]
		payee.update_attributes!(name: params['name'])
		render json: payee
	end

	def destroy
		Payee.find(params[:id]).destroy
		head status: :ok
	end
end
