# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160406005616) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "accounts", force: :cascade do |t|
    t.string   "name",               limit: 255,                 null: false
    t.string   "account_type",       limit: 255,                 null: false
    t.decimal  "opening_balance",                                null: false
    t.string   "status",             limit: 255,                 null: false
    t.integer  "related_account_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "favourite",                      default: false, null: false
  end

  create_table "categories", force: :cascade do |t|
    t.string   "name",       limit: 255,                 null: false
    t.string   "direction",  limit: 255,                 null: false
    t.integer  "parent_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "favourite",              default: false, null: false
  end

  create_table "payees", force: :cascade do |t|
    t.string   "name",       limit: 255,                 null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "favourite",              default: false, null: false
  end

  create_table "schedules", force: :cascade do |t|
    t.date     "next_due_date",             null: false
    t.string   "frequency",     limit: 255, null: false
    t.boolean  "estimate",                  null: false
    t.boolean  "auto_enter",                null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "securities", force: :cascade do |t|
    t.string   "name",       limit: 255,                 null: false
    t.string   "code",       limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "favourite",              default: false, null: false
  end

  create_table "security_prices", force: :cascade do |t|
    t.decimal  "price",       null: false
    t.date     "as_at_date",  null: false
    t.integer  "security_id", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "security_prices", ["security_id"], name: "index_security_prices_on_security_id", using: :btree

  create_table "transaction_accounts", force: :cascade do |t|
    t.integer  "transaction_id",             null: false
    t.integer  "account_id",                 null: false
    t.string   "direction",      limit: 255, null: false
    t.string   "status",         limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "transaction_accounts", ["account_id", "transaction_id"], name: "index_transaction_accounts_on_account_id_and_transaction_id", using: :btree
  add_index "transaction_accounts", ["transaction_id", "account_id"], name: "index_transaction_accounts_on_transaction_id_and_account_id", using: :btree

  create_table "transaction_categories", primary_key: "transaction_id", force: :cascade do |t|
    t.integer  "category_id", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "transaction_categories", ["category_id"], name: "index_transaction_categories_on_category_id", using: :btree

  create_table "transaction_flags", primary_key: "transaction_id", force: :cascade do |t|
    t.string   "memo",       limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "transaction_headers", primary_key: "transaction_id", force: :cascade do |t|
    t.integer  "payee_id"
    t.integer  "security_id"
    t.integer  "schedule_id"
    t.date     "transaction_date"
    t.decimal  "quantity"
    t.decimal  "price"
    t.decimal  "commission"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "transaction_headers", ["payee_id"], name: "index_transaction_headers_on_payee_id", using: :btree
  add_index "transaction_headers", ["security_id"], name: "index_transaction_headers_on_security_id", using: :btree

  create_table "transaction_splits", force: :cascade do |t|
    t.integer  "transaction_id", null: false
    t.integer  "parent_id",      null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "transaction_splits", ["transaction_id", "parent_id"], name: "index_transaction_splits_on_transaction_id_and_parent_id", unique: true, using: :btree

  create_table "transactions", force: :cascade do |t|
    t.decimal  "amount"
    t.text     "memo"
    t.string   "transaction_type", limit: 255, null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
