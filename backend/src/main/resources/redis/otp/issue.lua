-- KEYS[1] = code hash key, KEYS[2] = attempt counter key
-- ARGV[1] = code hash, ARGV[2] = TTL in milliseconds
-- A new code replaces the old one and always starts with a fresh attempt budget.
redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2])
redis.call('DEL', KEYS[2])
return 1
