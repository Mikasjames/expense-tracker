import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

export interface ConfirmationDialogContext {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

@Component({
  selector: 'app-confirmation-dialog',
  imports: [HlmButtonImports, HlmDialogImports],
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>{{ context.title }}</h3>
      <p hlmDialogDescription class="mb-3 text-sm text-muted-foreground">
        {{ context.message }}
      </p>
    </hlm-dialog-header>
    <div class="flex flex-col-reverse justify-end gap-2 sm:flex-row">
      <button hlmBtn variant="outline" type="button" (click)="cancel()">
        {{ context.cancelLabel ?? 'Cancel' }}
      </button>
      <button
        hlmBtn
        type="button"
        [variant]="context.destructive ? 'destructive' : 'default'"
        (click)="confirm()"
      >
        {{ context.confirmLabel ?? 'Confirm' }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  readonly context = injectBrnDialogContext<ConfirmationDialogContext>();
  private readonly dialogRef = inject(BrnDialogRef);

  confirm() {
    this.context.onConfirm();
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
