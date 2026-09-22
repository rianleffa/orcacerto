import React from 'react';
import { Budget, CompanyProfile } from '../../types/database';
import { formatCurrency, formatDate, formatPhone, formatDocument, getPaymentMethodLabel } from '../../lib/utils';
import { ShieldCheck, Clock, CreditCard } from 'lucide-react';

interface TemplateProps {
  budget: Budget;
  company: CompanyProfile;
}

export const ElegantTemplate: React.FC<TemplateProps> = ({ budget, company }) => {
  const primaryColor = budget.primary_color || company.primary_color || '#059669';

  return (
    <div
      id="budget-document-print"
      className="w-full bg-[#fdfbf7] text-slate-850 p-8 sm:p-12 rounded-xl shadow-sm border-2 border-stone-300 transition-all font-serif-elegant text-sm relative"
      style={{ minHeight: '842px' }}
    >
      {/* Decorative inner frame */}
      <div className="absolute inset-3 border border-stone-300/60 pointer-events-none rounded-lg" />

      {/* Header */}
      <div className="text-center pb-8 border-b-2 border-stone-200 relative z-10">
        <div className="inline-block mb-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-16 w-auto max-w-[140px] mx-auto object-contain"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {company.name.charAt(0)}
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-stone-900 uppercase">
          {company.name}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-4 text-xs text-stone-600 font-sans mt-2">
          {company.document && <span>CNPJ: {formatDocument(company.document)}</span>}
          {company.phone && <span>Tel: {formatPhone(company.phone)}</span>}
          {company.email && <span>{company.email}</span>}
        </div>
        {company.address && (
          <p className="text-xs text-stone-500 font-sans mt-1">{company.address}</p>
        )}

        <div className="mt-4 pt-3 inline-flex items-center gap-4 border-t border-stone-200 font-sans text-xs">
          <span className="font-bold uppercase tracking-widest text-stone-700">
            Proposta Comercial {budget.budget_number}
          </span>
          <span className="text-stone-400">•</span>
          <span>Emitido em: {formatDate(budget.created_at, 'long')}</span>
          <span className="text-stone-400">•</span>
          <span>Validade: {budget.validity_days} dias</span>
        </div>
      </div>

      {/* Customer & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-stone-200 relative z-10 font-sans">
        <div className="p-4 rounded-lg bg-stone-100/60 border border-stone-200/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-serif-elegant">
            Apresentado a
          </h3>
          <p className="font-bold text-stone-900 text-base">{budget.client?.name || 'Cliente'}</p>
          <div className="text-xs text-stone-600 space-y-1 mt-2">
            {budget.client?.document && <p>Documento: {formatDocument(budget.client.document)}</p>}
            {budget.client?.phone && <p>Telefone: {formatPhone(budget.client.phone)}</p>}
            {budget.client?.email && <p>E-mail: {budget.client.email}</p>}
            {budget.client?.address && <p>Endereço: {budget.client.address}</p>}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-stone-100/60 border border-stone-200/80 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 font-serif-elegant">
            Escopo da Proposta
          </h3>
          <p className="font-medium text-stone-800 leading-relaxed text-sm">
            {budget.title || 'Prestação de Serviços Especializados'}
          </p>
          {budget.execution_time && (
            <div className="flex items-center gap-1.5 mt-3 text-stone-700">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>Prazo de execução: <strong>{budget.execution_time}</strong></span>
            </div>
          )}
          {budget.warranty && (
            <div className="flex items-center gap-1.5 mt-1 text-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
              <span>Garantia contratual: <strong>{budget.warranty}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="py-6 relative z-10 font-sans">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-stone-300 text-stone-700 text-xs uppercase font-serif-elegant">
              <th className="py-2.5 px-2">Discriminação dos Serviços / Produtos</th>
              <th className="py-2.5 px-2 text-center w-16">Qtd</th>
              <th className="py-2.5 px-2 text-right w-28">Preço Unit.</th>
              <th className="py-2.5 px-2 text-right w-32">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 text-xs sm:text-sm">
            {budget.items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-3 px-2 align-top font-medium text-stone-900">
                  {item.description}
                </td>
                <td className="py-3 px-2 text-center align-top text-stone-600">
                  {item.quantity}
                </td>
                <td className="py-3 px-2 text-right align-top text-stone-600">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-3 px-2 text-right align-top font-bold text-stone-900">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-t-2 border-stone-200 relative z-10 font-sans text-xs">
        <div className="space-y-3 text-stone-700">
          <div>
            <h4 className="font-bold uppercase tracking-wider text-stone-500 font-serif-elegant text-xs mb-1">
              Condições Comerciais
            </h4>
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <CreditCard className="w-4 h-4 text-stone-600" />
              <span>{getPaymentMethodLabel(budget.payment_method)}</span>
            </div>
            {budget.payment_terms && <p className="mt-1 text-stone-600">{budget.payment_terms}</p>}
          </div>

          {company.pix_key && (
            <div className="p-3 bg-stone-100/70 rounded border border-stone-200">
              <span className="font-bold text-stone-800">Chave PIX:</span>{' '}
              <code className="font-mono">{company.pix_key}</code>
            </div>
          )}

          {budget.notes && (
            <div className="pt-2">
              <p className="font-bold text-stone-600 mb-0.5 font-serif-elegant">Observações:</p>
              <p className="italic text-stone-600 leading-relaxed">{budget.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div className="border border-stone-300 rounded-lg p-5 bg-white/80 space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(budget.subtotal)}</span>
            </div>
            {budget.discount_total > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Desconto concedido:</span>
                <span className="font-medium">- {formatCurrency(budget.discount_total)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-serif-elegant">
              <span className="text-base font-bold text-stone-900">Investimento Total:</span>
              <span className="text-2xl font-bold text-stone-950">
                {formatCurrency(budget.total)}
              </span>
            </div>
          </div>

          {budget.show_signature && (
            <div className="mt-8 text-center">
              <div className="inline-block border-t border-stone-400 px-10 pt-2 text-center">
                <p className="font-serif-elegant text-sm font-bold text-stone-900">
                  {budget.signature_name || company.name}
                </p>
                <p className="text-[11px] text-stone-500 font-sans">Assinatura autorizada</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
