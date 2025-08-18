import slugify from 'slugify';

/**
 * Generate a unique slug for a book
 * @param title - Book title
 * @returns Unique slug with random suffix
 */
export function generateBookSlug(title: string): string {
  // Create base slug from title
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  // Generate random suffix (7 digits as specified in requirements)
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
  
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Validate slug format
 * @param slug - Slug to validate
 * @returns Whether slug is valid
 */
export function isValidSlug(slug: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{7}$/;
  return slugPattern.test(slug);
}
