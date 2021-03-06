class CreateTransactions < ActiveRecord::Migration[5.1]
  def change
    create_table :transactions do |t|
      t.decimal :amount
      t.text :memo
      t.string :transaction_type, null: false

      t.timestamps
    end
  end
end
