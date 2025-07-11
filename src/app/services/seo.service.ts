import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateTags(config?: any) {
    const domain = environment.appUrl;
    config = {
      title: 'Bill Splitter',
      description: 'Bạn cứ chill – bill tôi chia',
      image: `${domain}/thumbnail.webp`,
      keywords: 'Bill splitter, Chia tiền, Chia hóa đơn, Thanhdc',
      ...config,
    };

    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'keywords', content: config.keywords });

    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: config.image });

    this.meta.updateTag({ name: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'og:title', content: config.title });
    this.meta.updateTag({ name: 'og:description', content: config.description });
    this.meta.updateTag({ name: 'og:image', content: config.image });
  }
}
