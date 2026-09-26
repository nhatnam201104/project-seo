-- KEYS[1] = counter key, ARGV[1] = window in milliseconds
-- Returns {count within the current window, remaining window in milliseconds}.
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  -- Never leave a counter without expiry: that would block the subject forever.
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
