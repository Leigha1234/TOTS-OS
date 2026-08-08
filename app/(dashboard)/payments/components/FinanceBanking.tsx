"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CreditCard,
  Landmark,
  Link2,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import EmptyState from "./EmptyState";
import SectionShell from "./SectionShell";
import StatusPill from "./StatusPill";

export type FinanceBankAccount = {
  id: string;
  name: string;
  bank_name?: string | null;
  account_type?: string | null;

  balance: number;

  currency?: string | null;

  status?: string | null;

  last_synced_at?: string | null;
};

export type FinanceBankTransaction = {
  id: string;
  description: string;

  amount: number;

  date: string;

  type?:
    | "credit"
    | "debit"
    | string;

  category?: string | null;

  status?: string | null;

  account_name?: string | null;
};

type FinanceBankingProps = {
  accounts?: FinanceBankAccount[];

  transactions?: FinanceBankTransaction[];

  onConnectBank?: () => void;

  onRefresh?: () => void;

  syncing?: boolean;
};

const currency = (
  value: number,
  currencyCode = "GBP"
) =>
  Number(value || 0).toLocaleString(
    "en-GB",
    {
      style: "currency",
      currency:
        currencyCode ||
        "GBP",
    }
  );

export default function FinanceBanking({
  accounts = [],
  transactions = [],
  onConnectBank,
  onRefresh,
  syncing = false,
}: FinanceBankingProps) {
  const totalBalance =
    accounts.reduce(
      (sum, account) =>
        sum +
        Number(
          account.balance ||
            0
        ),
      0
    );

  const inflow =
    transactions
      .filter(
        (transaction) =>
          transaction.amount >
            0 ||
          transaction.type ===
            "credit"
      )
      .reduce(
        (
          sum,
          transaction
        ) =>
          sum +
          Math.abs(
            Number(
              transaction.amount ||
                0
            )
          ),
        0
      );

  const outflow =
    transactions
      .filter(
        (transaction) =>
          transaction.amount <
            0 ||
          transaction.type ===
            "debit"
      )
      .reduce(
        (
          sum,
          transaction
        ) =>
          sum +
          Math.abs(
            Number(
              transaction.amount ||
                0
            )
          ),
        0
      );

  return (
    <div className="space-y-6">
      {/* BALANCE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-stone-900 text-white rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] font-black text-stone-500">
                Available Cash
              </p>

              <p className="text-3xl font-mono tracking-tight mt-4 text-[#a9b897]">
                {currency(
                  totalBalance
                )}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-[#a9b897]">
              <Landmark
                size={17}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-green-600">
            <ArrowDownLeft
              size={15}
            />

            <p className="text-[8px] uppercase tracking-[0.3em] font-black">
              Inflow
            </p>
          </div>

          <p className="text-2xl font-mono mt-4">
            {currency(inflow)}
          </p>
        </div>

        <div className="bg-white border border-stone-100 rounded-[2rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-500">
            <ArrowUpRight
              size={15}
            />

            <p className="text-[8px] uppercase tracking-[0.3em] font-black">
              Outflow
            </p>
          </div>

          <p className="text-2xl font-mono mt-4">
            {currency(outflow)}
          </p>
        </div>
      </div>

      {/* BANK ACCOUNTS */}
      <SectionShell
        title="Bank Accounts"
        subtitle="Connected business accounts and available balances."
        action={
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                disabled={
                  syncing
                }
                onClick={
                  onRefresh
                }
                className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={
                    syncing
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>
            )}

            {onConnectBank && (
              <button
                type="button"
                onClick={
                  onConnectBank
                }
                className="bg-stone-900 text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-[#a9b897] hover:text-stone-900 transition-all"
              >
                <Link2
                  size={14}
                />

                <span className="text-[8px] font-black uppercase tracking-widest">
                  Connect Bank
                </span>
              </button>
            )}
          </div>
        }
      >
        {accounts.length ===
        0 ? (
          <EmptyState
            icon={Building2}
            title="No bank accounts connected"
            description="Connect a business bank account to see balances and reconcile transactions."
            actionLabel={
              onConnectBank
                ? "Connect Bank"
                : undefined
            }
            onAction={
              onConnectBank
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(
              (account) => (
                <div
                  key={
                    account.id
                  }
                  className="bg-[#faf9f6] border border-stone-100 rounded-[1.75rem] p-5 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-[#a9b897]">
                      <WalletCards
                        size={
                          17
                        }
                      />
                    </div>

                    <StatusPill
                      status={
                        account.status ||
                        "connected"
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <p className="font-bold text-stone-900">
                      {
                        account.name
                      }
                    </p>

                    <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-1">
                      {account.bank_name ||
                        "Bank account"}
                      {account.account_type
                        ? ` · ${account.account_type}`
                        : ""}
                    </p>

                    <p className="font-mono text-2xl font-bold mt-5">
                      {currency(
                        account.balance,
                        account.currency ||
                          "GBP"
                      )}
                    </p>

                    {account.last_synced_at && (
                      <p className="text-[8px] font-mono uppercase tracking-widest text-stone-300 mt-3">
                        Last synced{" "}
                        {new Date(
                          account.last_synced_at
                        ).toLocaleString(
                          "en-GB"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </SectionShell>

      {/* TRANSACTIONS */}
      <SectionShell
        title="Bank Transactions"
        subtitle="Recent movement across connected business accounts."
      >
        {transactions.length ===
        0 ? (
          <EmptyState
            icon={CreditCard}
            title="No bank transactions"
            description="Transactions from connected accounts will appear here."
          />
        ) : (
          <div className="space-y-2">
            {transactions.map(
              (
                transaction
              ) => {
                const incoming =
                  transaction.amount >
                    0 ||
                  transaction.type ===
                    "credit";

                return (
                  <div
                    key={
                      transaction.id
                    }
                    className="flex items-center justify-between gap-4 p-4 rounded-xl hover:bg-[#faf9f6] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`
                          w-10 h-10
                          rounded-xl
                          flex items-center justify-center
                          shrink-0
                          ${
                            incoming
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }
                        `}
                      >
                        {incoming ? (
                          <ArrowDownLeft
                            size={
                              15
                            }
                          />
                        ) : (
                          <ArrowUpRight
                            size={
                              15
                            }
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">
                          {
                            transaction.description
                          }
                        </p>

                        <p className="text-[8px] uppercase tracking-widest text-stone-400 mt-1">
                          {
                            transaction.date
                          }

                          {transaction.category &&
                            ` · ${transaction.category}`}

                          {transaction.account_name &&
                            ` · ${transaction.account_name}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`font-mono font-bold ${
                          incoming
                            ? "text-green-600"
                            : "text-stone-900"
                        }`}
                      >
                        {incoming
                          ? "+"
                          : "-"}
                        {currency(
                          Math.abs(
                            transaction.amount
                          )
                        )}
                      </p>

                      {transaction.status && (
                        <div className="mt-1 flex justify-end">
                          <StatusPill
                            status={
                              transaction.status
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </SectionShell>
    </div>
  );
}