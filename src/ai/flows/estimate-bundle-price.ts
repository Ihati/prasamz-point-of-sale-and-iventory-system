'use server';

/**
 * @fileOverview A flow for estimating the price of a product bundle.
 *
 * - estimateBundlePrice - A function that estimates the price of a product bundle.
 * - EstimateBundlePriceInput - The input type for the estimateBundlePrice function.
 * - EstimateBundlePriceOutput - The return type for the estimateBundlePrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateBundlePriceInputSchema = z.object({
  products: z
    .array(
      z.object({
        name: z.string().describe('The name of the product.'),
        quantity: z.number().describe('The quantity of the product.'),
        price: z.number().describe('The price of the product.'),
      })
    )
    .describe('The list of products in the bundle.'),
  customerName: z.string().describe('The name of the customer.'),
});
export type EstimateBundlePriceInput = z.infer<typeof EstimateBundlePriceInputSchema>;

const EstimateBundlePriceOutputSchema = z.object({
  estimatedPrice: z.number().describe('The estimated price of the product bundle.'),
  reasoning: z.string().describe('The reasoning behind the estimated price.'),
});
export type EstimateBundlePriceOutput = z.infer<typeof EstimateBundlePriceOutputSchema>;

export async function estimateBundlePrice(input: EstimateBundlePriceInput): Promise<EstimateBundlePriceOutput> {
  return estimateBundlePriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateBundlePricePrompt',
  input: {schema: EstimateBundlePriceInputSchema},
  output: {schema: EstimateBundlePriceOutputSchema},
  prompt: `You are an experienced sales assistant helping to estimate the price for custom product bundles for customers.

  Consider the products in the bundle, their individual prices, and the customer when estimating the final price. Take into account any potential discounts or special considerations.

  Products:
  {{#each products}}
  - {{name}} (Quantity: {{quantity}}, Price: {{price}})
  {{/each}}

  Customer Name: {{customerName}}

  Estimate the final price of the bundle and provide a brief reasoning for your estimation. Return the estimated price as a number and the reasoning as a string. Do not include currency symbols.
`,
});

const estimateBundlePriceFlow = ai.defineFlow(
  {
    name: 'estimateBundlePriceFlow',
    inputSchema: EstimateBundlePriceInputSchema,
    outputSchema: EstimateBundlePriceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
