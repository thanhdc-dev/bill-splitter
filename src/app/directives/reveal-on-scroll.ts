import { Directive, ElementRef, HostListener, OnInit, inject } from '@angular/core';

/**
 * Toggles an `is-visible` class on the host once the page has scrolled past
 * `threshold`. Used by the floating "Lưu & chia sẻ" FAB (create-bill,
 * bill-details) so it stays hidden on first paint instead of sitting on top
 * of the payment tabs on short mobile viewports — see docs/implementation-notes.md.
 */
@Directive({
  selector: '[appRevealOnScroll]',
  standalone: true,
})
export class RevealOnScroll implements OnInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly threshold = 120;

  ngOnInit(): void {
    this.updateVisibility();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.updateVisibility();
  }

  private updateVisibility(): void {
    this.el.nativeElement.classList.toggle('is-visible', window.scrollY > this.threshold);
  }
}
