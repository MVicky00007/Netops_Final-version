
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [MatIconModule, MatCardModule],
  template: `
    <div class="page">
      <mat-card>
        <mat-card-content class="content">
          <mat-icon class="big">construction</mat-icon>
          <h2>{{ feature || 'This page' }} is coming soon</h2>
          <p>The backend endpoint is live — this UI just needs to be built next.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .page { padding: 24px; max-width: 720px; margin: 0 auto; }
    .content { text-align: center; padding: 48px 24px; }
    .big { font-size: 64px; height: 64px; width: 64px; color: #ef6c00; }
    h2 { margin: 16px 0 8px; }
    p { color: rgba(0,0,0,.6); margin: 0; }
  `,
})
export class ComingSoonComponent {
  @Input() feature?: string;
}
