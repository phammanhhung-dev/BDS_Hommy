import { useEffect } from 'react';
import { setMetaTag, setPageSEO } from '../../utils/seo';

export function useOperatorPageSEO({
  title,
  description,
  keywords,
  canonicalPath,
}) {
  useEffect(() => {
    const pageTitle = `${title} | Hommy Điều hành`;
    const canonical = `https://hommy.vn${canonicalPath}`;

    setPageSEO({
      title: pageTitle,
      description,
      keywords,
      canonical,
      ogTitle: pageTitle,
      ogDescription: description,
      ogUrl: canonical,
    });

    setMetaTag('robots', 'noindex,nofollow');
    setMetaTag('og:type', 'website', 'property');
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', pageTitle);
    setMetaTag('twitter:description', description);
  }, [title, description, keywords, canonicalPath]);
}
