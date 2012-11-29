class Video < ActiveRecord::Base
  attr_accessible :video, :url, :tag_list

  # Tags
  acts_as_taggable

  has_many :fun, :as => :content, :dependent => :destroy
end