import React from 'react';
import { Budget, CompanyProfile } from '../../types/database';
import { formatCurrency, formatDate, formatPhone, formatDocument, getPaymentMethodLabel } from '../../lib/utils';

interface TemplateProps {
  budget: Budget;
  company: CompanyProfile;
}

export const MinimalistTemplate: React.FC<TemplateProps> = ({ budget, company }) => {
  return (
    <div
      id="budget-document-print"
      className="w-full bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200 transition-all font-sans text-xs"
      style={{ minHeight: '842px' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start pb-8 border-b border-slate-900">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block mb-1">
            EMISSOR
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            {company.name}
          </h1>
          <div className="text-slate-500 mt-1 space-y-0.5">
            {company.document && <p>CNPJ/CPF: {formatDocument(company.document)}</p>}
            {company.phone && <p>Tel: {formatPhone(company.phone)}</p>}
            {company.email && <p>{company.email}</p>}
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-[10px] uppercase text-slate-400 block mb-1">
            DOCUMENTO
          </span>
          <p className="text-2xl font-bold text-slate-950">{budget.budget_number}</p>
          <p className="text-slate-500 mt-1">
            {formatDate(budget.created_at, 'short')}
          </p>
          <p className="text-slate-500">Validade: {budget.validity_days} dias</p>
        </div>
      </div>

      {/* Client & Scope */}
      <div className="grid grid-cols-2 gap-8 py-8 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block mb-1">
            CLIENTE
          </span>
          <p className="font-bold text-sm text-slate-900">{budget.client?.name}</p>
          <div className="text-slate-500 mt-1 space-y-0.5">
            {budget.client?.document && <p>{formatDocument(budget.client.document)}</p>}
            {budget.client?.phone && <p>{formatPhone(budget.client.phone)}</p>}
            {budget.client?.email && <p>{budget.client.email}</p>}
            {budget.client?.address && <p>{budget.client.address}</p>}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block mb-1">
            RESUMO / ESCOPO
          </span>
          <p className="font-medium text-slate-800">{budget.title}</p>
          <div className="text-slate-500 mt-2 space-y-0.5">
            {budget.execution_time && <p>Prazo: {budget.execution_time}</p>}
            {budget.warranty && <p>Garantia: {budget.warranty}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="py-8">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-900 text-[11px] font-mono uppercase text-slate-500">
              <th className="py-2">Descrição</th>
              <th className="py-2 text-center w-16">Qtd</th>
              <th className="py-2 text-right w-28">Unitário</th>
              <th className="py-2 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {budget.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-3 pr-4 font-normal text-slate-800">{item.description}</td>
                <td className="py-3 text-center text-slate-500">{item.quantity}</td>
                <td className="py-3 text-right text-slate-500 font-mono">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-3 text-right font-mono font-medium text-slate-900">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Summary */}
      <div className="pt-6 border-t border-slate-900 grid grid-cols-2 gap-8">
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block mb-0.5">
              PAGAMENTO
            </span>
            <p className="font-medium text-slate-900">{getPaymentMethodLabel(budget.payment_method)}</p>
            {budget.payment_terms && <p className="text-slate-500 mt-0.5">{budget.payment_terms}</p>}
          </div>

          {company.pix_key && (
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 block mb-0.5">
                CHAVE PIX
              </span>
              <p className="font-mono text-slate-700">{company.pix_key}</p>
            </div>
          )}

          {budget.notes && (
            <div className="text-slate-500 pt-1">
              <p className="text-[10px] font-mono tracking-widest uppercase text-slate-400 mb-0.5">
                OBSERVAÇÕES
              </p>
              <p className="leading-relaxed">{budget.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between items-end text-right font-mono">
          <div className="space-y-1.5 w-full max-w-[200px]">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>{formatCurrency(budget.subtotal)}</span>
            </div>
            {budget.discount_total > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Desconto:</span>
                <span>-{formatCurrency(budget.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-300">
              <span>TOTAL:</span>
              <span>{formatCurrency(budget.total)}</span>
            </div>
          </div>

          {budget.show_signature && (
            <div className="mt-12 text-center pt-2 border-t border-slate-400 min-w-[200px]">
              <p className="text-xs font-semibold text-slate-900">{budget.signature_name || company.name}</p>
              <p className="text-[10px] text-slate-400">Assinatura</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
