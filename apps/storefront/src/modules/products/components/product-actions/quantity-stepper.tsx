import { clx } from "@modules/common/components/ui"

type QuantityStepperProps = {
  quantity: number
  onChange: (quantity: number) => void
  /**
   * Highest quantity the buyer may pick. Null means no cap applies: the
   * variant does not manage inventory, or it allows backorders.
   */
  maxQuantity?: number | null
  disabled?: boolean
}

/**
 * Quantity stepper for the buy box. Minimum 1, capped at maxQuantity when
 * the selected variant manages inventory. The cap comes from the variant's
 * real inventory quantity; nothing here invents stock.
 */
const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onChange,
  maxQuantity,
  disabled,
}) => {
  const atMin = quantity <= 1
  const atMax =
    maxQuantity !== null &&
    maxQuantity !== undefined &&
    quantity >= maxQuantity

  const buttonClass = clx(
    "w-10 h-full flex items-center justify-center text-paper-muted",
    "disabled:text-paper-faint disabled:cursor-not-allowed",
    "hover:text-paper-text hover:bg-paper-surface transition-colors"
  )

  return (
    <div className="flex items-center gap-x-3" data-testid="quantity-stepper">
      <span className="font-humanist text-[12px] font-medium text-paper-muted">Quantity</span>
      <div className="inline-flex items-center border border-paper-border bg-paper-raised rounded-specimen h-11 overflow-hidden">
        <button
          type="button"
          aria-label="Decrease quantity"
          data-testid="quantity-decrease"
          className={buttonClass}
          disabled={disabled || atMin}
          onClick={() => onChange(quantity - 1)}
        >
          -
        </button>
        <span
          data-testid="quantity-value"
          aria-live="polite"
          className="w-12 self-stretch flex items-center justify-center text-center font-humanist font-semibold text-[14px] text-paper-text border-x border-paper-border"
        >
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          data-testid="quantity-increase"
          className={buttonClass}
          disabled={disabled || atMax}
          onClick={() => onChange(quantity + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default QuantityStepper
