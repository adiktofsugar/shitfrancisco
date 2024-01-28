# Pricing

- DynamoDB
  - One table, on-demand
  - Scan for index
    - Cost per request is based on table size. Maximum return data is 1MB (auto-paginated). Cost is 1 RRU per 8KB.
    - Data I'll get back is:
      - an integer for the date (4B)
      - a string of some length for message (~1B per character)
        - all current messages (47) combined are 2214 characters
        - avg is ~50 chars each
      - an integer for id (4B)
      - Total: 8B + 50B + 10B (random amazon stuff) = ~70B
      - 1KB = 10 posts, so 1 RRU = 80 posts
      - The free tier doesn't seem to care about this pricing model though...they only care about data transfer out, which is capped at 100GB. 100GB = 1B posts read...assuming we have a maximum of 100 posts one day, that would be 10M page renders (14K / hour).
  - Put for create
    - Like get, it does have write request units, but free tier is only concerned with data transferred out, which would be responses to creating posts, which rarely happens.
- Cognito Identity Pool
  -
- Cognito User Pool
