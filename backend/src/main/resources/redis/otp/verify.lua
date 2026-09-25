-- KEYS[1] = code hash key, KEYS[2] = attempt counter key
-- ARGV[1] = submitted code hash, ARGV[2] = attempt window in milliseconds, ARGV[3] = max attempts
-- Returns 1 = accepted (code consumed), 0 = wrong or missing code, -1 = attempt budget exhausted.
-- Count, compare and consume in one step so a code can be redeemed at most once,
-- even when several requests submit it concurrently.
local attempts = redis.call('INCR', KEYS[2])
if attempts == 1 then
  redis.call('PEXPIRE', KEYS[2], ARGV[2])
end
if attempts > tonumber(ARGV[3]) then
  redis.call('DEL', KEYS[1])
  return -1
end
local stored = redis.call('GET', KEYS[1])
if stored and stored == ARGV[1] then
  redis.call('DEL', KEYS[1], KEYS[2])
  return 1
end
return 0
