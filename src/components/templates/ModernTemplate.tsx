import React from 'react';
import { Budget, CompanyProfile } from '../../types/database';
import { formatCurrency, formatDate, formatPhone, formatDocument, getPaymentMethodLabel } from '../../lib/utils';
import { QrCode, ShieldCheck, Clock, CreditCard, Building2, User } from 'lucide-react';

interface TemplateProps {
  budget: Budget;
  company: CompanyProfile;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ budget, company }) => {
  const primaryColor = budget.primary_color || company.primary_color || '#10b981';

  return (
    <div
      id="budget-document-print"
      className="w-full bg-white text-slate-800 p-8 sm:p-10 rounded-xl shadow-sm border border-slate-200 transition-all font-sans text-sm"
      style={{ minHeight: '842px' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-16 w-auto max-w-[140px] object-contain rounded-lg"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {company.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {company.name}
            </h1>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
              {company.document && <span>CNPJ: {formatDocument(company.document)}</span>}
              {company.phone && <span>Tel: {formatPhone(company.phone)}</span>}
              {company.email && <span>{company.email}</span>}
            </div>
            {company.address && (
              <p className="text-xs text-slate-400 mt-0.5">{company.address}</p>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[180px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Orçamento
          </span>
          <div
            className="text-2xl font-black tracking-tight mt-0.5"
            style={{ color: primaryColor }}
          >
            {budget.budget_number}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Data: {formatDate(budget.created_at || new Date().toISOString(), 'short')}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Validade: {budget.validity_days} dias
          </div>
        </div>
      </div>

      {/* Title & Client Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-200">
        <div className="md:col-span-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Dados do Cliente
          </span>
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">
              {budget.client?.name || 'Cliente não selecionado'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
              {budget.client?.document && (
                <div><span className="text-slate-400">CPF/CNPJ:</span> {formatDocument(budget.client.document)}</div>
              )}
              {budget.client?.phone && (
                <div><span className="text-slate-400">Telefone:</span> {formatPhone(budget.client.phone)}</div>
              )}
              {budget.client?.email && (
                <div><span className="text-slate-400">E-mail:</span> {budget.client.email}</div>
              )}
              {budget.client?.address && (
                <div className="sm:col-span-2"><span className="text-slate-400">Endereço:</span> {budget.client.address}</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Resumo do Projeto
          </span>
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100/70 text-xs">
            <p className="font-medium text-slate-800 leading-relaxed">
              {budget.title || 'Prestação de Serviços Especializados'}
            </p>
            {budget.execution_time && (
              <div className="flex items-center gap-1.5 mt-3 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Prazo: <strong>{budget.execution_time}</strong></span>
              </div>
            )}
            {budget.warranty && (
              <div className="flex items-center gap-1.5 mt-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Garantia: <strong>{budget.warranty}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="py-6">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Serviços e Materiais Inclusos
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Item & Descrição</th>
                <th className="py-3 px-4 text-center w-16">Qtd</th>
                <th className="py-3 px-4 text-right w-28">Unitário</th>
                {budget.discount_total > 0 && <th className="py-3 px-4 text-right w-24">Desc.</th>}
                <th className="py-3 px-4 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {budget.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 align-top">
                    <span className="font-semibold text-slate-800 block">
                      {item.description}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center align-top text-slate-600 font-medium">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right align-top text-slate-600">
                    {formatCurrency(item.unit_price)}
                  </td>
                  {budget.discount_total > 0 && (
                    <td className="py-3 px-4 text-right align-top text-rose-500">
                      {item.discount > 0 ? `- ${formatCurrency(item.discount)}` : '—'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-right align-top font-bold text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Calculation & Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-t border-slate-200">
        {/* Payment & Terms */}
        <div className="space-y-4 text-xs text-slate-600">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Condições de Pagamento
            </span>
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>{getPaymentMethodLabel(budget.payment_method)}</span>
            </div>
            {budget.payment_terms && (
              <p className="mt-1 text-slate-600">{budget.payment_terms}</p>
            )}
          </div>

          {company.pix_key && budget.payment_method === 'pix' && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <QrCode className="w-7 h-7 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Chave PIX para pagamento:</p>
                <code className="text-xs font-mono font-bold text-slate-800 select-all">
                  {company.pix_key}
                </code>
              </div>
            </div>
          )}

          {budget.notes && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Observações Gerais
              </span>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                {budget.notes}
              </p>
            </div>
          )}
        </div>

        {/* Totals Box */}
        <div className="flex flex-col justify-between">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(budget.subtotal)}</span>
            </div>
            {budget.discount_total > 0 && (
              <div className="flex justify-between text-xs text-rose-600">
                <span>Desconto especial:</span>
                <span className="font-semibold">- {formatCurrency(budget.discount_total)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">Valor Total:</span>
              <span
                className="text-2xl font-black tracking-tight"
                style={{ color: primaryColor }}
              >
                {formatCurrency(budget.total)}
              </span>
            </div>
          </div>

          {/* Visual Digital Signature */}
          {budget.show_signature && (
            <div className="mt-8 pt-4 text-center">
              <div className="inline-block border-t border-slate-300 px-12 pt-2 text-center">
                <p className="text-xs font-semibold text-slate-800">
                  {budget.signature_name || company.name}
                </p>
                <p className="text-[11px] text-slate-400">Assinatura do Responsável</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer text */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400">
        <span>Documento gerado eletronicamente via OrçaCerto</span>
        <span>Agradecemos a preferência e confiança em nosso trabalho!</span>
      </div>
    </div>
  );
};
